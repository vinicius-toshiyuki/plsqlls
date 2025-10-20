# plsqlls

Opinionated LSP implementation for Oracle PL/SQL.
This is an incomplete quality-of-life tool that does a minimal effort to implement the capabilities it declares to supporteffort to implement the capabilities it declares to support.
I only try to implement what I need and when I need it.

## Build

`npm run compile`

## Integration with Neovim

Run `npm link` to install the `plsqlls` command globally.

### Using `nvim-lspconfig`

Add a new config for `vim.lsp.config` in `<runtime path>/lsp/plsqlls.lua`

```lua
return {
    deprecate = false,
    cmd = { "plsqlls", "--stdio" },
    filetypes = { "plsql", "plsqltemplate" },
    root_markers = { ".plsqllsrc", "plsqllsrc.json", ".git" },
    single_file_support = true,
}
```

Then enable it somewhere

```lua
vim.lsp.enable({ "plsqlls" })
```
