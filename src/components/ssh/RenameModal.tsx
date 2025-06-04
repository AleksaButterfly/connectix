import { useState } from 'react'
import type { FileInfo } from '@/types/ssh'

interface RenameModalProps {
  file: FileInfo
  onClose: () => void
  onRename: (oldPath: string, newName: string) => void
}

export function RenameModal({ file, onClose, onRename }: RenameModalProps) {
  const [newName, setNewName] = useState(file.name)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newName.trim() && newName !== file.name) {
      onRename(file.path, newName.trim())
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Rename {file.type === 'directory' ? 'Folder' : 'File'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">New Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-terminal-green focus:outline-none"
              placeholder="Enter new name"
              autoFocus
              onFocus={(e) => {
                // Select filename without extension for files
                if (file.type === 'file' && file.name.includes('.')) {
                  const lastDotIndex = file.name.lastIndexOf('.')
                  e.target.setSelectionRange(0, lastDotIndex)
                } else {
                  e.target.select()
                }
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || newName === file.name}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
