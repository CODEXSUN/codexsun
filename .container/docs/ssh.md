1. Copy your public key (in PowerShell on your PC):


Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
That copies this line:


ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOwddIStfsJEIKfXMWrP9+46+A5SLgyU+suLnzzx8TWG ashok@techmedia.in
2. Add the key to the container. Use either way:

Option A – the container's console. In the Proxmox web UI, select the container with IP 192.168.20.15, then open Console. Pick xterm.js from the Console dropdown, because it supports pasting. Log in as root and run:


mkdir -p /root/.ssh && chmod 700 /root/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOwddIStfsJEIKfXMWrP9+46+A5SLgyU+suLnzzx8TWG ashok@techmedia.in' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys