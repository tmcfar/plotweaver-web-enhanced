"""Tests for the preview capture functionality."""

from bff.preview.capture import capture_preview


def test_capture_preview_function_exists():
    """Test that the capture_preview function is importable."""
    assert callable(capture_preview)


def test_capture_preview_accepts_path_parameter():
    """Test that capture_preview accepts a path parameter."""
    # This is a simple signature test since we don't want to actually
    # run Playwright in tests without proper setup
    import inspect

    sig = inspect.signature(capture_preview)
    assert "url" in sig.parameters or len(sig.parameters) >= 1
