"""Tests for the browser capture functionality."""

import pytest
from unittest.mock import AsyncMock, patch
from pathlib import Path
from src.preview.capture import capture_preview


class TestCapturePreview:
    """Test cases for the capture_preview function."""

    @pytest.mark.asyncio
    async def test_capture_preview_basic(self):
        """Test basic screenshot capture functionality."""
        # Mock all Playwright components
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        # Set up the mock chain
        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page

        with patch("src.preview.capture.async_playwright") as mock_pw:
            # Configure the async context manager
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            # Test parameters
            test_url = "https://example.com"
            test_path = Path("/tmp/test_screenshot.png")

            # Call the function
            await capture_preview(test_url, test_path)

            # Verify all calls were made correctly
            mock_chromium.launch.assert_called_once()
            mock_browser.new_page.assert_called_once()
            mock_page.set_viewport_size.assert_called_once_with(
                {"width": 1280, "height": 720}
            )
            mock_page.goto.assert_called_once_with(test_url)
            mock_page.screenshot.assert_called_once_with(path=str(test_path))
            mock_browser.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_capture_preview_custom_dimensions(self):
        """Test screenshot capture with custom dimensions."""
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            test_url = "https://example.com"
            test_path = Path("/tmp/custom_screenshot.png")
            custom_width = 1920
            custom_height = 1080

            await capture_preview(
                test_url, test_path, width=custom_width, height=custom_height
            )

            # Verify custom dimensions were used
            mock_page.set_viewport_size.assert_called_once_with(
                {"width": custom_width, "height": custom_height}
            )

    @pytest.mark.asyncio
    async def test_capture_preview_with_path_string(self):
        """Test that Path object is converted to string for screenshot."""
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            test_url = "https://example.com"
            test_path = Path("/tmp/path_test.png")

            await capture_preview(test_url, test_path)

            # Verify path was converted to string
            mock_page.screenshot.assert_called_once_with(path=str(test_path))

    @pytest.mark.asyncio
    async def test_capture_preview_browser_launch_error(self):
        """Test handling of browser launch errors."""
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.side_effect = Exception("Browser launch failed")

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            test_url = "https://example.com"
            test_path = Path("/tmp/error_test.png")

            # Should propagate the exception
            with pytest.raises(Exception, match="Browser launch failed"):
                await capture_preview(test_url, test_path)

    @pytest.mark.asyncio
    async def test_capture_preview_page_error(self):
        """Test handling of page navigation errors."""
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page
        mock_page.goto.side_effect = Exception("Page load failed")

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            test_url = "https://invalid-url"
            test_path = Path("/tmp/page_error_test.png")

            # Should propagate the page error
            with pytest.raises(Exception, match="Page load failed"):
                await capture_preview(test_url, test_path)

            # Browser should still be closed even on error
            mock_browser.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_capture_preview_screenshot_error(self):
        """Test handling of screenshot errors."""
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page
        mock_page.screenshot.side_effect = Exception("Screenshot failed")

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            test_url = "https://example.com"
            test_path = Path("/tmp/screenshot_error_test.png")

            # Should propagate the screenshot error
            with pytest.raises(Exception, match="Screenshot failed"):
                await capture_preview(test_url, test_path)

            # Browser should still be closed even on error
            mock_browser.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_capture_preview_browser_cleanup(self):
        """Test that browser is properly cleaned up."""
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            test_url = "https://example.com"
            test_path = Path("/tmp/cleanup_test.png")

            await capture_preview(test_url, test_path)

            # Verify browser cleanup
            mock_browser.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_capture_preview_viewport_size(self):
        """Test viewport size settings."""
        mock_browser = AsyncMock()
        mock_page = AsyncMock()
        mock_playwright = AsyncMock()
        mock_chromium = AsyncMock()

        mock_playwright.chromium = mock_chromium
        mock_chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page

        test_sizes = [(800, 600), (1920, 1080), (2560, 1440), (3840, 2160)]

        with patch("src.preview.capture.async_playwright") as mock_pw:
            mock_pw.return_value.__aenter__.return_value = mock_playwright
            mock_pw.return_value.__aexit__.return_value = None

            for width, height in test_sizes:
                mock_page.reset_mock()
                test_url = "https://example.com"
                test_path = Path(f"/tmp/viewport_test_{width}x{height}.png")

                await capture_preview(test_url, test_path, width=width, height=height)

                mock_page.set_viewport_size.assert_called_once_with(
                    {"width": width, "height": height}
                )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
