import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from 'react'

interface ConfirmDialogProps {
    title: string
    description: string
    onConfirm: () => void
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
}

export default function ConfirmDialog({
    title,
    description,
    onConfirm,
    trigger,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default"
}: ConfirmDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)

    const open = externalOpen !== undefined ? externalOpen : internalOpen
    const setOpen = externalOnOpenChange || setInternalOpen

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "destructive" ? "destructive" : "default"}
                        onClick={() => {
                            onConfirm()
                            setOpen(false)
                        }}
                        className={variant === "default" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
