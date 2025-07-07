import re
from typing import List, Set


class HTMLSanitizer:
    """HTML sanitizer for manuscript preview content."""

    ALLOWED_TAGS: Set[str] = {
        "p",
        "br",
        "strong",
        "em",
        "u",
        "i",
        "b",
        "span",
        "div",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "ul",
        "ol",
        "li",
    }

    ALLOWED_ATTRIBUTES: Set[str] = {"class", "id", "style"}

    DANGEROUS_PATTERNS: List[str] = [
        r"<\s*script\b[^>]*>.*?</\s*script\s*>",  # Complete script blocks
        r"<\s*style\b[^>]*>.*?</\s*style\s*>",  # Complete style blocks
        r"<\s*iframe\b[^>]*>.*?</\s*iframe\s*>",  # Complete iframe blocks
        r"<\s*(object|embed|form|input|button|link|meta)\b[^>]*/?>",  # Other dangerous tags
    ]

    def __init__(self):
        self.pattern = re.compile(
            "|".join(self.DANGEROUS_PATTERNS), re.IGNORECASE | re.DOTALL
        )

    def sanitize(self, html: str) -> str:
        """Sanitize HTML content for safe preview rendering."""
        if not html:
            return ""

        # Remove dangerous patterns first
        html = self.pattern.sub("", html)

        # Basic tag filtering - must come before attribute filtering
        html = self._filter_tags(html)

        # Remove dangerous attributes
        html = self._filter_attributes(html)

        # Additional cleanup for remaining dangerous content
        html = self._final_cleanup(html)

        return html

    def _filter_tags(self, html: str) -> str:
        """Filter out non-allowed HTML tags."""
        # More comprehensive tag filtering
        tag_pattern = r"<\s*/?(\w+)(?:\s[^>]*)?\s*>"

        def tag_replacer(match):
            tag_name = match.group(1).lower()
            if tag_name in self.ALLOWED_TAGS:
                return match.group(0)
            else:
                # Remove the entire tag and its content for script/style tags
                return ""

        # Remove entire script/style blocks first
        html = re.sub(
            r"<\s*(script|style)\b[^>]*>.*?</\s*\1\s*>",
            "",
            html,
            flags=re.IGNORECASE | re.DOTALL,
        )

        # Then filter remaining tags
        return re.sub(tag_pattern, tag_replacer, html)

    def _filter_attributes(self, html: str) -> str:
        """Filter out dangerous attributes."""
        # Parse and reconstruct tags to properly handle attributes
        tag_pattern = r"<(\w+)([^>]*)>"

        def process_tag(match):
            tag_name = match.group(1).lower()
            attributes = match.group(2)

            if tag_name not in self.ALLOWED_TAGS:
                return ""  # Remove entire tag if not allowed

            # Clean attributes
            if attributes:
                # Remove dangerous attributes
                attr_patterns = [
                    r'\s+on\w+\s*=\s*(["\'][^"\']*["\']|[^\s>]*)',  # Event handlers
                    r'\s+href\s*=\s*(["\']javascript:[^"\']*["\']|javascript:[^\s>]*)',  # JS URLs
                    r'\s+src\s*=\s*(["\']javascript:[^"\']*["\']|javascript:[^\s>]*)',  # JS sources
                ]

                for pattern in attr_patterns:
                    attributes = re.sub(pattern, "", attributes, flags=re.IGNORECASE)

                # Keep only safe attributes
                safe_attrs = []
                attr_pattern = r'\s+(\w+)(?:\s*=\s*(["\'][^"\']*["\']|[^\s>]*))?'
                for attr_match in re.finditer(attr_pattern, attributes):
                    attr_name = attr_match.group(1).lower()
                    if attr_name in self.ALLOWED_ATTRIBUTES:
                        safe_attrs.append(attr_match.group(0))

                attributes = "".join(safe_attrs)

            return f"<{tag_name}{attributes}>"

        return re.sub(tag_pattern, process_tag, html)

    def _final_cleanup(self, html: str) -> str:
        """Final cleanup pass to remove any remaining dangerous content."""
        # Remove any remaining script content or dangerous patterns
        cleanup_patterns = [
            r"alert\s*\([^)]*\)",  # Alert calls
            r"javascript\s*:",  # JavaScript protocols
            r"vbscript\s*:",  # VBScript protocols
            r"data\s*:",  # Data URLs (can be dangerous)
            r"expression\s*\(",  # CSS expressions
        ]

        for pattern in cleanup_patterns:
            html = re.sub(pattern, "", html, flags=re.IGNORECASE)

        return html


def sanitize_html(html: str) -> str:
    """Convenience function for HTML sanitization."""
    sanitizer = HTMLSanitizer()
    return sanitizer.sanitize(html)
