import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';

interface CommentsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function CommentsPagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
}: CommentsPaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        {t('comments.pagination.showing', {
          from,
          to,
          total,
        })}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          {t('comments.pagination.previous')}
        </Button>
        <div className="flex items-center px-3 text-sm">
          {t('comments.pagination.page', {
            current: currentPage,
            total: totalPages,
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          {t('comments.pagination.next')}
        </Button>
      </div>
    </div>
  );
}
