"""Comprehensive tests for the HTML sanitizer module."""

import pytest
from src.preview.sanitizer import HTMLSanitizer, sanitize_html


class TestHTMLSanitizer:
    """Test cases for HTMLSanitizer class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.sanitizer = HTMLSanitizer()

    def test_allowed_tags_remain_unchanged(self):
        """Test that allowed tags are preserved."""
        html = (
            "<p>This is a <strong>bold</strong> paragraph with <em>emphasis</em>.</p>"
        )
        result = self.sanitizer.sanitize(html)
        assert result == html

    def test_disallowed_tags_are_removed(self):
        """Test that disallowed tags are stripped."""
        html = "<p>Safe content</p><script>alert('danger')</script>"
        result = self.sanitizer.sanitize(html)
        assert "<script>" not in result
        assert "alert('danger')" not in result
        assert "<p>Safe content</p>" in result

    def test_dangerous_attributes_removed(self):
        """Test that dangerous attributes are removed."""
        html = "<p onclick=\"alert('hack')\">Click me</p>"
        result = self.sanitizer.sanitize(html)
        assert "onclick" not in result
        assert "alert" not in result
        assert "<p>Click me</p>" == result.strip()

    def test_allowed_attributes_preserved(self):
        """Test that safe attributes are preserved."""
        html = '<span class="highlight" id="section1">Text</span>'
        result = self.sanitizer.sanitize(html)
        assert 'class="highlight"' in result
        assert 'id="section1"' in result

    def test_nested_tags_handled_correctly(self):
        """Test that nested allowed tags work properly."""
        html = "<div><p>Outer <strong>bold <em>and italic</em></strong> text</p></div>"
        result = self.sanitizer.sanitize(html)
        assert result == html

    def test_self_closing_tags(self):
        """Test that self-closing tags are handled correctly."""
        html = "<p>Line one<br/>Line two</p>"
        result = self.sanitizer.sanitize(html)
        # Should preserve br tags
        assert "<br" in result
        assert "Line one" in result
        assert "Line two" in result

    def test_empty_input(self):
        """Test that empty input returns empty string."""
        assert self.sanitizer.sanitize("") == ""
        assert self.sanitizer.sanitize(None) == ""

    def test_whitespace_preservation(self):
        """Test that whitespace is preserved appropriately."""
        html = "<p>  Text with   spaces  </p>"
        result = self.sanitizer.sanitize(html)
        # Should preserve internal spacing
        assert "Text with   spaces" in result

    def test_special_characters(self):
        """Test that special characters are handled correctly."""
        html = "<p>&amp; &lt; &gt; &quot; &#39;</p>"
        result = self.sanitizer.sanitize(html)
        assert result == html

    def test_malformed_html(self):
        """Test behavior with malformed HTML."""
        html = "<p>Unclosed paragraph<strong>Bold without close"
        result = self.sanitizer.sanitize(html)
        # Should still contain the text content
        assert "Unclosed paragraph" in result
        assert "Bold without close" in result

    def test_case_insensitive_tags(self):
        """Test that tag matching is case insensitive."""
        html = "<P>Uppercase paragraph</P><STRONG>Uppercase bold</STRONG>"
        result = self.sanitizer.sanitize(html)
        assert "Uppercase paragraph" in result
        assert "Uppercase bold" in result

    def test_url_schemes_in_links(self):
        """Test that dangerous URL schemes are blocked."""
        html = "<a href=\"javascript:alert('hack')\">Link</a>"
        result = self.sanitizer.sanitize(html)
        assert "javascript:" not in result

    def test_css_injection_prevention(self):
        """Test that CSS injection attempts are blocked."""
        html = '<p style="background: url(javascript:alert(1))">Text</p>'
        result = self.sanitizer.sanitize(html)
        assert "javascript:" not in result

    def test_large_input_handling(self):
        """Test that large inputs are handled efficiently."""
        large_html = "<p>" + "A" * 10000 + "</p>"
        result = self.sanitizer.sanitize(large_html)
        assert len(result) > 9000  # Should preserve most content
        assert result.startswith("<p>")
        assert result.endswith("</p>")


class TestSanitizeHTMLFunction:
    """Test cases for the standalone sanitize_html function."""

    def test_sanitize_html_function_basic(self):
        """Test basic functionality of sanitize_html function."""
        html = "<p>Safe <strong>content</strong></p><script>dangerous</script>"
        result = sanitize_html(html)
        assert "<p>Safe <strong>content</strong></p>" in result
        assert "<script>" not in result

    def test_sanitize_html_with_options(self):
        """Test sanitize_html with custom options."""
        html = "<div><p>Content</p></div>"
        # Test that it uses the default sanitizer
        result = sanitize_html(html)
        assert "<div>" in result or "Content" in result

    def test_sanitize_html_none_input(self):
        """Test sanitize_html with None input."""
        result = sanitize_html(None)
        assert result == ""

    def test_sanitize_html_empty_string(self):
        """Test sanitize_html with empty string."""
        result = sanitize_html("")
        assert result == ""


class TestSecurityVulnerabilities:
    """Test cases specifically for security vulnerabilities."""

    def setup_method(self):
        """Set up test fixtures."""
        self.sanitizer = HTMLSanitizer()

    def test_xss_script_injection(self):
        """Test protection against XSS script injection."""
        xss_attempts = [
            "<script>alert('XSS')</script>",
            "<img src='x' onerror='alert(1)'>",
            "<div onload='alert(1)'>",
            "javascript:alert('XSS')",
            "<iframe src='javascript:alert(1)'></iframe>",
        ]

        for xss in xss_attempts:
            result = self.sanitizer.sanitize(xss)
            assert "alert" not in result
            assert "javascript:" not in result
            assert "<script>" not in result

    def test_css_injection(self):
        """Test protection against CSS injection."""
        css_attacks = [
            '<p style="background: url(javascript:alert(1))">Text</p>',
            '<div style="expression(alert(1))">Text</div>',
        ]

        for css_attack in css_attacks:
            result = self.sanitizer.sanitize(css_attack)
            assert "javascript:" not in result
            assert "expression(" not in result

    def test_html_entity_handling(self):
        """Test proper handling of HTML entities."""
        html = "<p>&lt;script&gt;alert('test')&lt;/script&gt;</p>"
        result = self.sanitizer.sanitize(html)
        # Should preserve encoded entities
        assert "&lt;" in result
        assert "&gt;" in result
        # Should not execute decoded script
        assert result.count("script") <= 2  # Only in encoded form

    def test_attribute_injection(self):
        """Test protection against attribute injection."""
        html = '<p title="&quot; onmouseover=&quot;alert(1)&quot;">Text</p>'
        result = self.sanitizer.sanitize(html)
        assert "onmouseover" not in result
        assert "alert(1)" not in result


class TestPerformance:
    """Test cases for performance characteristics."""

    def setup_method(self):
        """Set up test fixtures."""
        self.sanitizer = HTMLSanitizer()

    def test_large_document_performance(self):
        """Test that large documents are processed efficiently."""
        # Create a large HTML document
        large_html = "<div>" + ("<p>Content</p>" * 1000) + "</div>"

        import time

        start_time = time.time()
        result = self.sanitizer.sanitize(large_html)
        end_time = time.time()

        # Should complete in reasonable time (less than 1 second)
        assert (end_time - start_time) < 1.0
        assert len(result) > 1000  # Should preserve content

    def test_deeply_nested_html(self):
        """Test handling of deeply nested HTML structures."""
        nested_html = "<div>" * 50 + "Content" + "</div>" * 50
        result = self.sanitizer.sanitize(nested_html)
        assert "Content" in result
        # Should handle without crashing


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
