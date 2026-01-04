import { useTranslation } from 'react-i18next';
import { Skeleton } from '~/components/ui/skeleton';
import { CommentsTable } from './CommentsTable';
import { CommentsPagination } from './CommentsPagination';

interface Comment {
  id: string;
  message: string;
  fromName: string;
  createdTime: Date;
  action: string;
  actionReason: string | null;
  replyMessage: string | null;
  permalinkUrl: string | null;
  post: {
    permalinkUrl: string | null;
    page: {
      name: string;
    };
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CommentsListCardProps {
  comments?: Comment[];
  pagination?: Pagination;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}

export function CommentsListCard({
  comments,
  pagination,
  isLoading,
  onPageChange,
}: CommentsListCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !comments || comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t('comments.list.noComments')}
        </div>
      ) : (
        <>
          <CommentsTable comments={comments} />
          {pagination && (
            <CommentsPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </div>
  );
}
