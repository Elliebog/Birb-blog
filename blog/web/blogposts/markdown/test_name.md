# Testing Code 
```python
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter
from pygments.styles import get_style_by_name


formatter = HtmlFormatter(style='material', nowrap=True)

def highlight_code(code, name, attr):
    lexer = PythonLexer()
    if name != '':
        lexer = get_lexer_by_name(name)
    
    return highlight(code, lexer, formatter)

def render_code_block(self, tokens, idx, options, env):
    return "<div class=\"highlight\">" + self.code_block(tokens, idx, options, env) + " </div>"

def render_fence_block(self, tokens, idx, options, env):
    return "<div class=\"highlight\">" + self.fence(tokens, idx, options,env) + " </div>"


mdfile = open("testmd.md", "r")
text = mdfile.read()

# Github REST API method
# os.system("gh api --method POST -H \"Accept: application/vnd.github+json\" -H \"X-Github-Api-Version: 2022-11-28\" /markdown -f text='{0}'".format(content))

md = MarkdownIt("gfm-like", {'html': True, 'highlight': highlight_code, 'typographer': True}).enable('table')
md.add_render_rule("fence", render_fence_block)
md.add_render_rule("code_block", render_code_block)
tokens = md.parse(text)
html_text = md.render(text)

htmlfile = open("test.html", "w")
htmlfile.write(html_text)

print(formatter.get_style_defs('.highlight'))

```