"""
Cortex Lattice - Modal Code Execution Sandbox

Deploys a web endpoint on Modal that receives user code + problem YAML,
runs tests in an isolated sandbox, and returns JSON results.

Deploy:  modal deploy executor/modal_executor.py
Test:    modal serve executor/modal_executor.py   (local dev server)
"""

import modal

app = modal.App("cortex-lattice-executor")

# Build the executor image — mirrors the local Dockerfile
executor_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("pyyaml>=6.0", "numpy>=1.26.0", "pytest>=7.4.0", "fastapi[standard]")
    .pip_install(
        "torch>=2.1.0",
        extra_index_url="https://download.pytorch.org/whl/cpu",
    )
    .add_local_file("executor/run_tests.py", "/code/run_tests.py")
)


@app.function(
    image=executor_image,
    timeout=30,
    memory=512,
    cpu=1,
)
@modal.fastapi_endpoint(method="POST")
def execute(item: dict):
    """
    Receive user code and problem YAML, run tests, return results.

    Expected JSON body:
    {
        "code": "def solve(...): ...",
        "problem_yaml": "id: two-pointers-asteroid-belt\n..."
    }

    Returns: ExecutionResult JSON (same schema as the Docker executor)
    """
    import json
    import logging
    import subprocess
    import tempfile
    import time
    from pathlib import Path

    logger = logging.getLogger("cortex-executor")
    logging.basicConfig(level=logging.INFO)

    code = item.get("code", "")
    problem_yaml = item.get("problem_yaml", "")

    logger.info("Received execution request: code=%d bytes, yaml=%d bytes", len(code), len(problem_yaml))

    if not code or not problem_yaml:
        logger.warning("Missing required fields")
        return {
            "success": False,
            "total": 0,
            "passed": 0,
            "failed": 0,
            "results": [],
            "error": "Missing required fields: code, problem_yaml",
        }

    # Write user code and problem YAML to temp files
    with tempfile.TemporaryDirectory() as tmpdir:
        solution_path = Path(tmpdir) / "solution.py"
        problem_dir = Path(tmpdir) / "problem"
        problem_dir.mkdir()

        solution_path.write_text(code)
        (problem_dir / "problem.yaml").write_text(problem_yaml)

        try:
            start = time.time()
            result = subprocess.run(
                ["python", "/code/run_tests.py", str(problem_dir), str(solution_path)],
                capture_output=True,
                text=True,
                timeout=25,  # Leave headroom within the 30s function timeout
            )
            elapsed_ms = round((time.time() - start) * 1000)

            output = result.stdout.strip() or result.stderr.strip()
            logger.info("Test runner finished in %dms (exit code %d)", elapsed_ms, result.returncode)

            if result.stderr.strip():
                logger.info("Test runner stderr: %s", result.stderr.strip()[:500])

            # Parse the JSON output from run_tests.py
            try:
                import re
                json_match = re.search(r"\{[\s\S]*\}", output)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    logger.info(
                        "Results: %d/%d passed, elapsed=%dms",
                        parsed.get("passed", 0),
                        parsed.get("total", 0),
                        elapsed_ms,
                    )
                    return parsed
                else:
                    logger.error("No JSON in output: %s", output[:500])
                    return {
                        "success": False,
                        "total": 0,
                        "passed": 0,
                        "failed": 0,
                        "results": [],
                        "error": output or "No JSON output from test runner",
                    }
            except json.JSONDecodeError as e:
                logger.error("JSON parse error: %s — output: %s", e, output[:500])
                return {
                    "success": False,
                    "total": 0,
                    "passed": 0,
                    "failed": 0,
                    "results": [],
                    "error": output or "Failed to parse test runner output",
                }

        except subprocess.TimeoutExpired:
            logger.error("Execution timed out after 25s")
            return {
                "success": False,
                "total": 0,
                "passed": 0,
                "failed": 0,
                "results": [],
                "error": "Execution timed out",
            }
        except Exception as e:
            logger.error("Execution error: %s", e, exc_info=True)
            return {
                "success": False,
                "total": 0,
                "passed": 0,
                "failed": 0,
                "results": [],
                "error": f"Execution error: {str(e)}",
            }
