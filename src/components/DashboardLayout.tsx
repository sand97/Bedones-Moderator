import Head from 'next/head';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { Separator } from '~/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '~/components/ui/breadcrumb';
import { AppSidebar } from './app-sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function DashboardLayout({
  children,
  pageTitle,
}: DashboardLayoutProps) {
  const fullTitle = pageTitle
    ? `Bedones Moderator | ${pageTitle}`
    : 'Bedones Moderator';

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
      </Head>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {pageTitle && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
