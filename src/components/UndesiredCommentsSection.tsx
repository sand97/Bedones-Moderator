import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '~/components/ui/checkbox';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import { Label } from '~/components/ui/label';
import { HelpInfo } from '~/components/HelpInfo';

interface UndesiredCommentsSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  action: 'delete' | 'hide';
  onActionChange: (action: 'delete' | 'hide') => void;
}

export function UndesiredCommentsSection({
  enabled,
  onEnabledChange,
  action,
  onActionChange
}: UndesiredCommentsSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(enabled);
  }, [enabled]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="undesired"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(!!checked)}
        />
        <Label htmlFor="undesired" className={`text-base font-medium ${enabled ? 'text-black' : 'text-gray-600'}`}>
          {t('undesiredComments.title')}
        </Label>
        <HelpInfo message={t('undesiredComments.description')} />
      </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="mt-4 ml-6 space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="hide-undesired"
                name="undesired-action"
                value="hide"
                checked={action === 'hide'}
                onChange={(e) => onActionChange(e.target.value as 'hide')}
                className="w-4 h-4 accent-black border-gray-300"
              />
              <Label htmlFor="hide-undesired" className={`text-sm ${action === 'hide' ? 'text-black' : 'text-gray-600'}`}>{t('undesiredComments.hide')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="delete-undesired"
                name="undesired-action"
                value="delete"
                checked={action === 'delete'}
                onChange={(e) => onActionChange(e.target.value as 'delete')}
                className="w-4 h-4 accent-black border-gray-300"
              />
              <Label htmlFor="delete-undesired" className={`text-sm ${action === 'delete' ? 'text-black' : 'text-gray-600'}`}>{t('undesiredComments.delete')}</Label>
            </div>
          </CollapsibleContent>
        </Collapsible>
    </div>
  );
}
