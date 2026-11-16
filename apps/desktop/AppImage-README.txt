BjeyFlow AppImage: launcher and icon
===================================

Download these release files into your Downloads folder:
  BjeyFlow-linux-x64.AppImage
  BjeyFlow-icon.png

The AppImage targets x86-64 Linux and may require FUSE 2. It needs an internet
connection. To keep it and its icon in a stable location and add a desktop
launcher, run these commands in a terminal:

install -Dm755 "$HOME/Downloads/BjeyFlow-linux-x64.AppImage" "$HOME/.local/opt/BjeyFlow/BjeyFlow.AppImage"
install -Dm644 "$HOME/Downloads/BjeyFlow-icon.png" "$HOME/.local/opt/BjeyFlow/icon.png"
mkdir -p "$HOME/.local/share/applications"
cat > "$HOME/.local/share/applications/com.bjeyflow.desktop.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=BjeyFlow
Comment=Your personal workspace
Exec="$HOME/.local/opt/BjeyFlow/BjeyFlow.AppImage"
Icon=$HOME/.local/opt/BjeyFlow/icon.png
Terminal=false
Categories=Office;
StartupWMClass=com.bjeyflow.desktop
EOF

BjeyFlow should appear in your applications menu; you may need to log out and
back in. You can pin it to your dock through your desktop environment.

To remove the launcher, delete ~/.local/share/applications/com.bjeyflow.desktop.desktop.
Remove ~/.local/opt/BjeyFlow separately if you no longer want the app files.
The DEB package installs its own launcher and icon and does not need these steps.
