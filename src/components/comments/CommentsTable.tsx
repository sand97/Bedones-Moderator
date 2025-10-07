import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface Comment {
  id: string;
  message: string;
  fromName: string;
  createdTime: Date;
  action: string;
  permalinkUrl: string | null;
  post: {
    permalinkUrl: string | null;
    page: {
      name: string;
    };
  };
}

interface CommentsTableProps {
  comments: Comment[];
}

export function CommentsTable({ comments }: CommentsTableProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? fr : enUS;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'delete':
        return <Badge variant="destructive">{t('comments.actions.delete')}</Badge>;
      case 'hide':
        return <Badge variant="secondary">{t('comments.actions.hide')}</Badge>;
      case 'reply':
        return <Badge variant="default">{t('comments.actions.reply')}</Badge>;
      case 'none':
        return <Badge variant="outline">{t('comments.actions.none')}</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('comments.table.page')}</TableHead>
            <TableHead>{t('comments.table.author')}</TableHead>
            <TableHead>{t('comments.table.message')}</TableHead>
            <TableHead>{t('comments.table.date')}</TableHead>
            <TableHead>{t('comments.table.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comments.map((comment) => (
            <TableRow key={comment.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{comment.post.page.name}</span>
                  {comment.post.permalinkUrl && (
                    <a
                      href={comment.post.permalinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>{comment.fromName}</TableCell>
              <TableCell className="max-w-md">
                <div className="flex items-start gap-2">
                  <p className="truncate" title={comment.message}>
                    {comment.message}
                  </p>
                  {comment.permalinkUrl && (
                    <a
                      href={comment.permalinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(comment.createdTime), 'PPp', { locale })}
              </TableCell>
              <TableCell>{getActionBadge(comment.action)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
