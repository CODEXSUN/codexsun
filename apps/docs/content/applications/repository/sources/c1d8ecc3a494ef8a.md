# .container/docs/ssh.md

Repository source: `.container/docs/ssh.md`

Source SHA-256 (LF line endings): `a9fd2924e85f40a91413f37fdeadb369a48e32e963aaf69d211d50133373bea8`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
1. Copy your public key (in PowerShell on your PC):


Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
That copies this line:


ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOwddIStfsJEIKfXMWrP9+46+A5SLgyU+suLnzzx8TWG ashok@techmedia.in
2. Add the key to the container. Use either way:

Option A – the container's console. In the Proxmox web UI, select the container with IP 192.168.20.15, then open Console. Pick xterm.js from the Console dropdown, because it supports pasting. Log in as root and run:


mkdir -p /root/.ssh && chmod 700 /root/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOwddIStfsJEIKfXMWrP9+46+A5SLgyU+suLnzzx8TWG ashok@techmedia.in' >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```
