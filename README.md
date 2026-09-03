# SQLancy

A minimal, fast SQLite browser built with Wails, Go and React.

Open a `.db` / `.sqlite` file, browse tables, view paginated rows, filter and sort, and run SQL queries in an embedded editor.

## Features

- Open SQLite files via file dialog or recent list
- Table list with row counts and schema info
- Paginated table view with cursor-based navigation
- Filter and sort per table
- SQL editor powered by CodeMirror with syntax highlighting
- Query execution with tabular results
- Recent databases persisted locally
- Pure Go SQLite driver (`modernc.org/sqlite`), no CGO required

## Installation

Download from [Releases](https://github.com/voidclancy/sqlancy/releases):

- Linux: `sqlancy_<version>_amd64.deb` or `sqlancy-linux-amd64.tar.gz` (single binary `sqlancy`)
- Windows: `sqlancy-windows-amd64.exe` (portable)
- macOS: `sqlancy-macos-universal.zip` (contains `sqlancy.app`)

