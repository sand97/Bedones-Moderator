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
  headerRight?: React.ReactNode;
}

export function DashboardLayout({
  children,
  pageTitle,
  headerRight,
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
            {headerRight && (
              <div className="ml-auto flex items-center gap-2">
                {headerRight}
              </div>
            )}
          </header>
          <div className="flex flex-1 flex-col p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
