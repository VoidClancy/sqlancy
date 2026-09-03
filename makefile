.PHONY: run generate frontend \
        build build-linux build-windows build-macos \
        build-windows-amd64 build-windows-arm64 \
        build-linux-amd64 build-linux-arm64 \
        clean dev test ci icons icons-check icons-propagate

# ─────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────

run:
	wails dev -tags webkit2_41
dev:
	wails dev -tags webkit2_41 --browser

# Generate Wails bindings
generate:
	wails generate module

g: generate


# ─────────────────────────────────────────────
# Frontend
# ─────────────────────────────────────────────

frontend:
	cd frontend && npm run build


# ─────────────────────────────────────────────
# Linux
# ─────────────────────────────────────────────

build-linux: frontend
	wails build -platform linux/amd64 -tags webkit2_41


build-linux-amd64: frontend
	wails build -platform linux/amd64 -tags webkit2_41


build-linux-arm64: frontend
	wails build -platform linux/arm64 -tags webkit2_41


# ─────────────────────────────────────────────
# Windows
# ─────────────────────────────────────────────

build-windows: frontend
	wails build -platform windows/amd64 && \
	rm -rf /home/clancy/share/fireburger && \
	mkdir -p /home/clancy/share/fireburger && \
	cp build/bin/FireBurger.exe /home/clancy/share/fireburger/ && \
	cp -a DB /home/clancy/share/fireburger/ && \
	cd /home/clancy/share && \
	rm -f FireBurger.zip && \
	zip -r FireBurger.zip fireburger/

build-win32: frontend
	wails build -platform windows/386 && \
	rm -rf /home/clancy/share/fireburger && \
	mkdir -p /home/clancy/share/fireburger && \
	cp build/bin/FireBurger.exe /home/clancy/share/fireburger/ && \
	cp -a DB /home/clancy/share/fireburger/ && \
	cd /home/clancy/share && \
	rm -f FireBurger.zip && \
	zip -r FireBurger.zip fireburger/

build-windows-amd64: frontend
	wails build -platform windows/amd64


build-windows-arm64: frontend
	wails build -platform windows/arm64


# ─────────────────────────────────────────────
# macOS
# ─────────────────────────────────────────────

build-macos: frontend
	wails build -platform darwin/amd64


build-macos-amd64: frontend
	wails build -platform darwin/amd64


build-macos-arm64: frontend
	wails build -platform darwin/arm64


# ─────────────────────────────────────────────
# Default build
# ─────────────────────────────────────────────

build: build-linux
	sudo cp ./build/bin/sqlancy /usr/local/bin/sqlancy


# ─────────────────────────────────────────────
# Cleanup
# ─────────────────────────────────────────────

clean:
	rm -rf build/bin
	rm -rf frontend/dist


lint:
	cd frontend && npx tsc --noEmit

test: 
	go test -v ./...

VERSION ?= $(shell git describe --tags --abbrev=0 2>/dev/null || echo v0.0.0)
VERSION_NUM := $(patsubst v%,%,$(VERSION))
DIST := dist
WEBKIT_TAG ?= $(shell pkg-config --exists webkit2gtk-4.1 2>/dev/null && echo webkit2_41 || echo webkit2_40)

# Icon: master is build/appicon.png (1024x1024 PNG). Wails generates
# build/windows/icon.ico and build/darwin/iconfile.icns from it if missing.
icons-check:
	@test -f build/appicon.png || (echo "Missing build/appicon.png (1024x1024 PNG)"; exit 1)
	@identify build/appicon.png 2>/dev/null | grep -q "PNG" || echo "WARN: build/appicon.png not PNG"
	@ls -lh build/appicon.png build/windows/icon.ico 2>/dev/null | awk '{print}'

icons:
	@echo "==> Propagating build/appicon.png -> all platforms (delete derived, next build regenerates)"
	@rm -f build/windows/icon.ico build/darwin/iconfile.icns build/darwin/iconfile.png
	@echo "  removed build/windows/icon.ico, build/darwin/iconfile.icns"
	@ls -lh build/appicon.png
	@echo "  Next wails build will regenerate derived icons from master."

icons-propagate: icons
	@echo "==> Regenerating icons (building current platform)..."
	@if [ "$$(uname)" = "Darwin" ]; then wails build -platform darwin/universal -tags $(WEBKIT_TAG) -clean; \
	elif pkg-config --exists webkit2gtk-4.1 2>/dev/null || pkg-config --exists webkit2gtk-4.0 2>/dev/null; then wails build -platform linux/amd64 -tags $(WEBKIT_TAG) -clean; \
	else wails build -platform windows/amd64 -clean; fi
	@ls -lh build/windows/icon.ico build/darwin/iconfile.icns 2>/dev/null || true
	@echo "  Done."

ci: icons clean
	@echo "==> [ci] VERSION=$(VERSION) ($(VERSION_NUM)) WEBKIT_TAG=$(WEBKIT_TAG)"
	@rm -rf $(DIST)
	@mkdir -p $(DIST)
	@echo "==> [ci] linux build"
	wails build -platform linux/amd64 -tags $(WEBKIT_TAG) -clean
	@echo "==> [ci] .deb"
	@rm -rf deb-package
	@mkdir -p deb-package/DEBIAN deb-package/usr/bin deb-package/usr/share/applications deb-package/usr/share/icons/hicolor/512x512/apps deb-package/usr/share/icons/hicolor/256x256/apps deb-package/usr/share/pixmaps
	@cp build/bin/sqlancy deb-package/usr/bin/sqlancy && chmod +x deb-package/usr/bin/sqlancy
	@if [ -f build/appicon.png ]; then cp build/appicon.png deb-package/usr/share/pixmaps/sqlancy.png && cp build/appicon.png deb-package/usr/share/icons/hicolor/512x512/apps/sqlancy.png && cp build/appicon.png deb-package/usr/share/icons/hicolor/256x256/apps/sqlancy.png; fi
	@echo "Package: sqlancy" > deb-package/DEBIAN/control
	@echo "Version: $(VERSION_NUM)" >> deb-package/DEBIAN/control
	@echo "Section: utils" >> deb-package/DEBIAN/control
	@echo "Priority: optional" >> deb-package/DEBIAN/control
	@echo "Architecture: amd64" >> deb-package/DEBIAN/control
	@echo "Maintainer: Clancy <a7mdmo2mn@gmail.com>" >> deb-package/DEBIAN/control
	@echo "Depends: libgtk-3-0, libwebkit2gtk-4.0-37 | libwebkit2gtk-4.1-0" >> deb-package/DEBIAN/control
	@echo "Description: High performance modern SQLite Browser built with Wails, Go, and React." >> deb-package/DEBIAN/control
	@echo " Fast, lightweight SQLite GUI for browsing, querying and managing databases." >> deb-package/DEBIAN/control
	@printf '%s\n' '[Desktop Entry]' 'Name=SQLancy' 'Comment=SQLite Browser & Management GUI' 'Exec=/usr/bin/sqlancy' 'Icon=sqlancy' 'Terminal=false' 'Type=Application' 'Categories=Development;Database;' 'StartupWMClass=sqlancy' > deb-package/usr/share/applications/sqlancy.desktop
	@dpkg-deb --build deb-package "$(DIST)/sqlancy_$(VERSION_NUM)_amd64.deb" && ls -lh $(DIST)/*.deb && rm -rf deb-package
	@echo "==> [ci] tarball"
	@tar -czvf $(DIST)/sqlancy-linux-amd64.tar.gz -C build/bin sqlancy && ls -lh $(DIST)/*.tar.gz
	@echo "==> [ci] windows build"
	@wails build -platform windows/amd64 -clean
	@cp build/bin/sqlancy.exe $(DIST)/sqlancy-windows-amd64.exe && ls -lh $(DIST)/sqlancy-windows-amd64.exe
	@if [ "$$(uname)" = "Darwin" ]; then echo "==> [ci] macOS build"; wails build -platform darwin/universal -clean && ditto -c -k --keepParent build/bin/sqlancy.app $(DIST)/sqlancy-macos-universal.zip && ls -lh $(DIST)/*.zip; else echo "==> [ci] skip macOS (requires macOS host)"; fi
	@echo ""
	@echo "─────────────────────────────────────────────"
	@echo " CI done — artifacts in ./$(DIST)/"
	@ls -lh $(DIST)/