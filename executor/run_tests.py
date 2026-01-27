#!/usr/bin/env python3
"""
Cortex Lattice - Test Runner

Executes user code against problem test cases in a sandboxed environment.
Outputs JSON results for the frontend to display.
"""

import json
import sys
import traceback
import signal
from pathlib import Path
from typing import Any
import yaml


class TimeoutError(Exception):
    """Raised when test execution times out."""
    pass


def timeout_handler(signum, frame):
    """Signal handler for test timeout."""
    raise TimeoutError("Test execution timed out")


def load_problem(problem_dir: Path) -> dict:
    """Load problem definition from YAML file."""
    problem_path = problem_dir / "problem.yaml"
    if not problem_path.exists():
        raise FileNotFoundError(f"Problem file not found: {problem_path}")

    with open(problem_path, "r") as f:
        return yaml.safe_load(f)


def import_user_solution(solution_path: Path) -> dict:
    """Import user solution and return its namespace."""
    if not solution_path.exists():
        raise FileNotFoundError(f"Solution file not found: {solution_path}")

    # Read and compile user code
    with open(solution_path, "r") as f:
        user_code = f.read()

    # Create isolated namespace for execution
    namespace = {"__builtins__": __builtins__}

    try:
        exec(compile(user_code, solution_path, "exec"), namespace)
    except SyntaxError as e:
        raise SyntaxError(f"Syntax error in solution: {e}")
    except Exception as e:
        raise RuntimeError(f"Error loading solution: {e}")

    return namespace


def normalize_output(value: Any) -> Any:
    """Normalize output for comparison (handle list/tuple, float precision, etc.)."""
    if isinstance(value, (list, tuple)):
        return [normalize_output(v) for v in value]
    if isinstance(value, float):
        # Round floats for comparison
        return round(value, 6)
    if isinstance(value, dict):
        return {k: normalize_output(v) for k, v in value.items()}
    return value


def compare_outputs(actual: Any, expected: Any) -> bool:
    """Compare actual output with expected output."""
    actual = normalize_output(actual)
    expected = normalize_output(expected)

    # Handle None/null comparison
    if expected is None:
        return actual is None

    # For lists, handle potential ordering issues for certain problem types
    # (can be extended based on problem requirements)
    if isinstance(expected, list) and isinstance(actual, list):
        if len(expected) != len(actual):
            return False
        return actual == expected

    return actual == expected


def run_single_test(func: callable, test_case: dict, timeout_seconds: int = 2) -> dict:
    """Run a single test case with timeout."""
    test_input = test_case.get("input", {})
    expected = test_case.get("expected")
    test_id = test_case.get("id", "unknown")
    explanation = test_case.get("explanation", "")

    result = {
        "id": test_id,
        "input": test_input,
        "expected": expected,
        "explanation": explanation,
        "passed": False,
        "output": None,
        "error": None,
        "execution_time_ms": 0,
    }

    try:
        # Set up timeout (Unix only)
        if hasattr(signal, 'SIGALRM'):
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout_seconds)

        import time
        start_time = time.time()

        # Execute user function with test input
        actual_output = func(**test_input)

        end_time = time.time()
        result["execution_time_ms"] = round((end_time - start_time) * 1000, 2)

        # Disable timeout
        if hasattr(signal, 'SIGALRM'):
            signal.alarm(0)

        result["output"] = actual_output
        result["passed"] = compare_outputs(actual_output, expected)

    except TimeoutError:
        result["error"] = f"Timeout: execution exceeded {timeout_seconds} seconds"
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {str(e)}"
        result["traceback"] = traceback.format_exc()
    finally:
        # Ensure timeout is disabled
        if hasattr(signal, 'SIGALRM'):
            signal.alarm(0)

    return result


def detect_function_name(problem: dict, namespace: dict) -> str:
    """Detect the main function name to test."""
    # Check if problem specifies function name
    starter_code = problem.get("starter_code_python", "")

    # Look for function definition in starter code
    for line in starter_code.split("\n"):
        if line.strip().startswith("def "):
            # Extract function name
            func_name = line.strip().split("(")[0].replace("def ", "").strip()
            if func_name in namespace and callable(namespace[func_name]):
                return func_name

    # Fallback: look for common function names in namespace
    common_names = ["solve", "solution", "main", "find_asteroid_pair", "find_top_k_pairs"]
    for name in common_names:
        if name in namespace and callable(namespace[name]):
            return name

    # Last resort: find any callable that's not built-in
    for name, obj in namespace.items():
        if callable(obj) and not name.startswith("_") and name not in dir(__builtins__):
            return name

    raise ValueError("Could not detect function to test")


def run_tests(problem_dir: Path, solution_path: Path) -> dict:
    """Run all test cases for a problem."""
    results = {
        "success": True,
        "total": 0,
        "passed": 0,
        "failed": 0,
        "results": [],
        "error": None,
    }

    try:
        # Load problem definition
        problem = load_problem(problem_dir)
        test_cases = problem.get("test_cases", [])

        if not test_cases:
            results["error"] = "No test cases found in problem definition"
            results["success"] = False
            return results

        results["total"] = len(test_cases)

        # Import user solution
        namespace = import_user_solution(solution_path)

        # Detect function to test
        func_name = detect_function_name(problem, namespace)
        func = namespace[func_name]

        # Run each test case
        for test_case in test_cases:
            test_result = run_single_test(func, test_case)
            results["results"].append(test_result)

            if test_result["passed"]:
                results["passed"] += 1
            else:
                results["failed"] += 1

    except FileNotFoundError as e:
        results["success"] = False
        results["error"] = str(e)
    except SyntaxError as e:
        results["success"] = False
        results["error"] = f"Syntax Error: {e}"
    except ValueError as e:
        results["success"] = False
        results["error"] = str(e)
    except Exception as e:
        results["success"] = False
        results["error"] = f"Unexpected error: {type(e).__name__}: {str(e)}"
        results["traceback"] = traceback.format_exc()

    return results


def main():
    """Main entry point for test runner."""
    # Default paths (can be overridden via args or environment)
    problem_dir = Path("/code/problem")
    solution_path = Path("/code/solution.py")

    # Override from command line args if provided
    if len(sys.argv) >= 3:
        problem_dir = Path(sys.argv[1])
        solution_path = Path(sys.argv[2])

    # Run tests
    results = run_tests(problem_dir, solution_path)

    # Output JSON results
    print(json.dumps(results, indent=2, default=str))

    # Exit with appropriate code
    sys.exit(0 if results["success"] and results["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
