.PHONY: run generate frontend \
        build build-linux build-windows build-macos \
        build-windows-amd64 build-windows-arm64 \
        build-linux-amd64 build-linux-arm64 \
        clean dev test

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