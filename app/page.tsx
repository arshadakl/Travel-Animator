import { EditorLayout } from "@/components/features/editor-layout"
import { Toaster } from "@/components/ui/sonner"

export default function Page() {
  return (
    <>
      <EditorLayout />
      <Toaster position="top-center" />
    </>
  )
}
