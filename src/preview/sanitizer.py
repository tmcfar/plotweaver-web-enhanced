import re
from typing import List, Set

class HTMLSanitizer:
    """HTML sanitizer for manuscript preview content."""
    
    ALLOWED_TAGS: Set[str] = {
        'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li'
    }
    
    ALLOWED_ATTRIBUTES: Set[str] = {
        'class', 'id', 'style'
    }
    
    DANGEROUS_PATTERNS: List[str] = [
        r'javascript:',
        r'vbscript:',
        r'data:',
        r'on\w+\s*=',
        r'<\s*script',
        r'<\s*iframe',
        r'<\s*object',
        r'<\s*embed',
        r'<\s*form',
        r'<\s*input',
        r'<\s*button',
        r'<\s*link',
        r'<\s*meta',
        r'<\s*style',
        r'expression\s*\(',
        r'url\s*\(',
        r'@import',
    ]
    
    def __init__(self):
        self.pattern = re.compile('|'.join(self.DANGEROUS_PATTERNS), re.IGNORECASE)
    
    def sanitize(self, html: str) -> str:
        """Sanitize HTML content for safe preview rendering."""
        if not html:
            return ""
        
        # Remove dangerous patterns
        html = self.pattern.sub('', html)
        
        # Basic tag filtering
        html = self._filter_tags(html)
        
        # Remove dangerous attributes
        html = self._filter_attributes(html)
        
        return html
    
    def _filter_tags(self, html: str) -> str:
        """Filter out non-allowed HTML tags."""
        # Simple regex-based approach for basic filtering
        # In production, consider using a proper HTML parser like BeautifulSoup
        tag_pattern = r'<\s*/?(\w+)(?:\s[^>]*)?\s*>'
        
        def tag_replacer(match):
            tag_name = match.group(1).lower()
            if tag_name in self.ALLOWED_TAGS:
                return match.group(0)
            else:
                return ''
        
        return re.sub(tag_pattern, tag_replacer, html)
    
    def _filter_attributes(self, html: str) -> str:
        """Filter out dangerous attributes."""
        # Remove event handlers and dangerous attributes
        attr_pattern = r'\s+(on\w+|href|src|action|formaction|background|data-[\w-]+)\s*=\s*["\'][^"\']*["\']'
        return re.sub(attr_pattern, '', html, flags=re.IGNORECASE)


def sanitize_html(html: str) -> str:
    """Convenience function for HTML sanitization."""
    sanitizer = HTMLSanitizer()
    return sanitizer.sanitize(html)