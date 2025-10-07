import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { DatePicker } from '~/components/ui/date-picker';

interface CommentsFiltersProps {
  pageId: string;
  setPageId: (value: string) => void;
  authorName: string;
  setAuthorName: (value: string) => void;
  action: string;
  setAction: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  pages?: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

export function CommentsFilters({
  pageId,
  setPageId,
  authorName,
  setAuthorName,
  action,
  setAction,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  pages,
  onClearFilters,
}: CommentsFiltersProps) {
  const { t } = useTranslation();

  const dateFromValue = dateFrom ? new Date(dateFrom) : undefined;
  const dateToValue = dateTo ? new Date(dateTo) : undefined;

  return (
    <div className="space-y-6">
      {/* Page Filter */}
      <div className="space-y-2">
        <Label htmlFor="page-filter">{t('comments.filters.page')}</Label>
        <Select
          value={pageId || 'all'}
          onValueChange={(value) => {
            setPageId(value === 'all' ? '' : value);
          }}
        >
          <SelectTrigger id="page-filter">
            <SelectValue placeholder={t('comments.filters.allPages')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('comments.filters.allPages')}</SelectItem>
            {pages?.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Author Filter */}
      <div className="space-y-2">
        <Label htmlFor="author-filter">{t('comments.filters.author')}</Label>
        <Input
          id="author-filter"
          placeholder={t('comments.filters.authorPlaceholder')}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>

      {/* Action Filter */}
      <div className="space-y-2">
        <Label htmlFor="action-filter">{t('comments.filters.action')}</Label>
        <Select
          value={action || 'all'}
          onValueChange={(value) => {
            setAction(value === 'all' ? '' : value);
          }}
        >
          <SelectTrigger id="action-filter">
            <SelectValue placeholder={t('comments.filters.allActions')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('comments.filters.allActions')}</SelectItem>
            <SelectItem value="none">{t('comments.actions.none')}</SelectItem>
            <SelectItem value="hide">{t('comments.actions.hide')}</SelectItem>
            <SelectItem value="delete">{t('comments.actions.delete')}</SelectItem>
            <SelectItem value="reply">{t('comments.actions.reply')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date From */}
      <div className="space-y-2">
        <Label htmlFor="date-from">{t('comments.filters.dateFrom')}</Label>
        <DatePicker
          date={dateFromValue}
          onSelect={(date) => {
            setDateFrom(date ? date.toISOString().split('T')[0] : '');
          }}
          placeholder={t('comments.filters.selectDate')}
        />
      </div>

      {/* Date To */}
      <div className="space-y-2">
        <Label htmlFor="date-to">{t('comments.filters.dateTo')}</Label>
        <DatePicker
          date={dateToValue}
          onSelect={(date) => {
            setDateTo(date ? date.toISOString().split('T')[0] : '');
          }}
          placeholder={t('comments.filters.selectDate')}
        />
      </div>

      {/* Clear Filters */}
      <div className="pt-4">
        <Button variant="outline" onClick={onClearFilters} className="w-full">
          {t('comments.filters.clear')}
        </Button>
      </div>
    </div>
  );
}
