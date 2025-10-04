import { useTranslation } from 'react-i18next';
import { Switch } from '~/components/ui/switch';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import { Label } from '~/components/ui/label';
import { HelpInfo } from '~/components/HelpInfo';

interface SpamDetectionSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  action: 'delete' | 'hide';
  onActionChange: (action: 'delete' | 'hide') => void;
}

export function SpamDetectionSection({
  enabled,
  onEnabledChange,
  action,
  onActionChange,
}: SpamDetectionSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center space-x-1">
          <Label
            htmlFor="spam"
            className={`text-base font-medium ${enabled ? 'text-black' : 'text-gray-600'} cursor-pointer`}
          >
            {t('spamDetection.title')}
          </Label>
          <HelpInfo message={t('spamDetection.description')} />
        </div>
        <Switch
          id="spam"
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(!!checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <Collapsible open={enabled}>
        <CollapsibleContent className="mt-4 ml-6 space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="hide-spam"
              name="spam-action"
              value="hide"
              checked={action === 'hide'}
              onChange={(e) => onActionChange(e.target.value as 'hide')}
              className="w-4 h-4 accent-black border-gray-300"
            />
            <Label
              htmlFor="hide-spam"
              className={`text-sm ${action === 'hide' ? 'text-black' : 'text-gray-600'}`}
            >
              {t('spamDetection.hide')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="delete-spam"
              name="spam-action"
              value="delete"
              checked={action === 'delete'}
              onChange={(e) => onActionChange(e.target.value as 'delete')}
              className="w-4 h-4 accent-black border-gray-300"
            />
            <Label
              htmlFor="delete-spam"
              className={`text-sm ${action === 'delete' ? 'text-black' : 'text-gray-600'}`}
            >
              {t('spamDetection.delete')}
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
