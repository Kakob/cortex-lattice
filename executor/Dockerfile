# Cortex Lattice - Code Execution Sandbox
# Python 3.11 with PyTorch (CPU only) for AI safety problems

FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

# Create non-root user for security
RUN groupadd -r executor && useradd -r -g executor executor

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Create working directory
WORKDIR /code

# Copy test runner
COPY run_tests.py /code/run_tests.py

# Set ownership
RUN chown -R executor:executor /code

# Switch to non-root user
USER executor

# Default command
CMD ["python", "run_tests.py"]
