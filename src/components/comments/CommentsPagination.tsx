import { useTranslation } from 'react-i18next';
import { Button } from '~/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalPages <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          {t('comments.pagination.previous')}
        </Button>
        <div className="text-sm">
          {t('comments.pagination.page', {
            current: currentPage,
            total: totalPages,
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages <= 1}
        >
          {t('comments.pagination.next')}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
