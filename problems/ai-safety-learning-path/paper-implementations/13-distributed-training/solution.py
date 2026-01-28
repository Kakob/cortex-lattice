"""Distributed Training System"""
import torch
import torch.nn as nn
import torch.distributed as dist
from typing import List, Optional

class DataParallel:
    """Simple data parallelism: replicate model, split data."""
    
    def __init__(self, model: nn.Module, device_ids: List[int]):
        self.model = model
        self.device_ids = device_ids
        self.replicas = [model.to(f"cuda:{i}") for i in device_ids]
    
    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        """Split batch across devices, gather outputs."""
        batch_size = inputs.shape[0]
        chunk_size = batch_size // len(self.device_ids)
        
        outputs = []
        for i, device_id in enumerate(self.device_ids):
            start = i * chunk_size
            end = start + chunk_size if i < len(self.device_ids) - 1 else batch_size
            
            chunk = inputs[start:end].to(f"cuda:{device_id}")
            output = self.replicas[i](chunk)
            outputs.append(output)
        
        # Gather to first device
        return torch.cat([o.to(self.device_ids[0]) for o in outputs], dim=0)

class GradientSynchronizer:
    """Synchronize gradients across processes."""
    
    def __init__(self, model: nn.Module):
        self.model = model
    
    def all_reduce_gradients(self):
        """Average gradients across all processes."""
        if not dist.is_initialized():
            return
        
        for param in self.model.parameters():
            if param.grad is not None:
                dist.all_reduce(param.grad, op=dist.ReduceOp.SUM)
                param.grad /= dist.get_world_size()

class PipelineParallel:
    """Pipeline parallelism: split model layers across devices."""
    
    def __init__(self, layers: List[nn.Module], device_ids: List[int]):
        self.device_ids = device_ids
        self.num_stages = len(device_ids)
        
        # Assign layers to devices
        layers_per_device = len(layers) // self.num_stages
        self.stages = []
        
        for i in range(self.num_stages):
            start = i * layers_per_device
            end = start + layers_per_device if i < self.num_stages - 1 else len(layers)
            stage_layers = nn.Sequential(*layers[start:end]).to(f"cuda:{device_ids[i]}")
            self.stages.append(stage_layers)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward through pipeline stages."""
        for i, stage in enumerate(self.stages):
            x = x.to(f"cuda:{self.device_ids[i]}")
            x = stage(x)
        return x

def setup_distributed(rank: int, world_size: int):
    """Initialize distributed training."""
    dist.init_process_group(
        backend="nccl",
        init_method="env://",
        world_size=world_size,
        rank=rank
    )
    torch.cuda.set_device(rank)

def distributed_training_loop(model, train_loader, optimizer, rank, world_size, epochs=10):
    """Training loop with gradient synchronization."""
    setup_distributed(rank, world_size)
    
    model = model.to(rank)
    synchronizer = GradientSynchronizer(model)
    
    for epoch in range(epochs):
        for batch in train_loader:
            inputs, targets = batch
            inputs = inputs.to(rank)
            targets = targets.to(rank)
            
            # Forward
            outputs = model(inputs)
            loss = nn.functional.cross_entropy(outputs, targets)
            
            # Backward
            optimizer.zero_grad()
            loss.backward()
            
            # Synchronize gradients
            synchronizer.all_reduce_gradients()
            
            # Update
            optimizer.step()
        
        if rank == 0:
            print(f"Epoch {epoch}, Loss: {loss.item():.4f}")
