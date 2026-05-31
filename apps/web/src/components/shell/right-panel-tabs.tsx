'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@fundededge/ui'

export default function RightPanelTabs() {
  return (
    <Tabs defaultValue="news" className="flex h-full flex-col">
      <TabsList className="shrink-0 rounded-none border-b border-[--color-border-subtle] bg-transparent px-3 py-0">
        <TabsTrigger value="news" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[--color-info] py-3">
          News
        </TabsTrigger>
        <TabsTrigger value="checklist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[--color-info] py-3">
          Checklist
        </TabsTrigger>
        <TabsTrigger value="journal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[--color-info] py-3">
          Journal
        </TabsTrigger>
      </TabsList>
      <TabsContent value="news" className="flex-1 overflow-auto">
        <div className="p-4 text-sm text-[--color-text-secondary]">Coming soon.</div>
      </TabsContent>
      <TabsContent value="checklist" className="flex-1 overflow-auto">
        <div className="p-4 text-sm text-[--color-text-secondary]">Coming soon.</div>
      </TabsContent>
      <TabsContent value="journal" className="flex-1 overflow-auto">
        <div className="p-4 text-sm text-[--color-text-secondary]">Coming soon.</div>
      </TabsContent>
    </Tabs>
  )
}
