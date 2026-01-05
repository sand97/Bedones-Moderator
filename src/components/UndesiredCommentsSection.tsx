import { useTranslation } from 'react-i18next';
import { Switch } from '~/components/ui/switch';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { HelpInfo } from '~/components/HelpInfo';

interface UndesiredCommentsSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  action: 'delete' | 'hide';
  onActionChange: (action: 'delete' | 'hide') => void;
  idPrefix?: string;
}

export function UndesiredCommentsSection({
  enabled,
  onEnabledChange,
  action,
  onActionChange,
  idPrefix = '',
}: UndesiredCommentsSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center space-x-1">
          <Label
            htmlFor={`${idPrefix}undesired`}
            className={`text-base font-medium ${enabled ? 'text-black' : 'text-gray-600'} cursor-pointer`}
          >
            {t('undesiredComments.title')}
          </Label>
          <HelpInfo message={t('undesiredComments.description')} />
        </div>
        <Switch
          id={`${idPrefix}undesired`}
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(!!checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <Collapsible open={enabled}>
        <CollapsibleContent className="mt-4 ml-3 space-y-3">
          <RadioGroup value={action} onValueChange={onActionChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hide" id={`${idPrefix}hide-undesired`} />
              <Label
                htmlFor={`${idPrefix}hide-undesired`}
                className="text-sm cursor-pointer"
              >
                {t('undesiredComments.hide')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="delete"
                id={`${idPrefix}delete-undesired`}
              />
              <Label
                htmlFor={`${idPrefix}delete-undesired`}
                className="text-sm cursor-pointer"
              >
                {t('undesiredComments.delete')}
              </Label>
            </div>
          </RadioGroup>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
