from pathlib import Path
from playwright.async_api import async_playwright


async def capture_preview(
    url: str, output_path: Path, width: int = 1280, height: int = 720
):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_viewport_size({"width": width, "height": height})
        await page.goto(url)
        await page.screenshot(path=str(output_path))
        await browser.close()