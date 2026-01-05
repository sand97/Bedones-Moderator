import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Switch } from '~/components/ui/switch';
import { Collapsible, CollapsibleContent } from '~/components/ui/collapsible';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Textarea } from '~/components/ui/textarea';
import { HelpInfo } from '~/components/HelpInfo';
import { PlusIcon, EditIcon, TrashIcon } from 'lucide-react';

export interface FAQItem {
  id: string;
  assertion: string;
  response: string;
}

interface IntelligentFAQSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  faqItems: FAQItem[];
  onFaqItemsChange: (items: FAQItem[]) => void;
  idPrefix?: string;
}

export function IntelligentFAQSection({
  enabled,
  onEnabledChange,
  faqItems,
  onFaqItemsChange,
  idPrefix = '',
}: IntelligentFAQSectionProps) {
  const { t } = useTranslation();
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);

  const faqValidationSchema = Yup.object({
    assertion: Yup.string()
      .required(t('intelligentFAQ.assertionRequired'))
      .min(3, t('intelligentFAQ.assertionMin')),
    response: Yup.string()
      .required(t('intelligentFAQ.responseRequired'))
      .min(3, t('intelligentFAQ.responseMin')),
  });

  const formik = useFormik({
    initialValues: {
      assertion: '',
      response: '',
    },
    validationSchema: faqValidationSchema,
    onSubmit: (values) => {
      if (editingFAQ) {
        onFaqItemsChange(
          faqItems.map((item) =>
            item.id === editingFAQ.id ? { ...item, ...values } : item,
          ),
        );
      } else {
        const newItem: FAQItem = {
          id: Date.now().toString(),
          ...values,
        };
        onFaqItemsChange([...faqItems, newItem]);
      }
      setFaqDialogOpen(false);
      setEditingFAQ(null);
      formik.resetForm();
    },
  });

  const handleEditFAQ = (item: FAQItem) => {
    setEditingFAQ(item);
    formik.setValues({
      assertion: item.assertion,
      response: item.response,
    });
    setFaqDialogOpen(true);
  };

  const handleDeleteFAQ = (id: string) => {
    onFaqItemsChange(faqItems.filter((item) => item.id !== id));
  };

  const handleDialogOpenChange = (open: boolean) => {
    setFaqDialogOpen(open);
    if (!open) {
      setEditingFAQ(null);
      formik.resetForm();
    }
  };

  const handleAddNew = () => {
    setEditingFAQ(null);
    formik.resetForm();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center space-x-1">
          <Label
            htmlFor={`${idPrefix}faq`}
            className={`text-base font-medium ${enabled ? 'text-black' : 'text-gray-600'} cursor-pointer`}
          >
            {t('intelligentFAQ.title')}
          </Label>
          <HelpInfo message={t('intelligentFAQ.description')} />
        </div>
        <Switch
          id={`${idPrefix}faq`}
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(!!checked)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <Collapsible open={enabled}>
        <CollapsibleContent className="mt-4 ml-3 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">
                {t('intelligentFAQ.rules')} ({faqItems.length})
              </h4>
              <Dialog
                open={faqDialogOpen}
                onOpenChange={handleDialogOpenChange}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleAddNew}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {t('intelligentFAQ.addFAQ')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingFAQ
                        ? t('intelligentFAQ.editRule')
                        : t('intelligentFAQ.addRule')}
                    </DialogTitle>
                    <DialogDescription>
                      {t('intelligentFAQ.configureDescription')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="assertion">
                        {t('intelligentFAQ.assertion')}
                      </Label>
                      <Textarea
                        id="assertion"
                        name="assertion"
                        value={formik.values.assertion}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t('intelligentFAQ.assertionPlaceholder')}
                        rows={3}
                        className={
                          formik.touched.assertion && formik.errors.assertion
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      {formik.touched.assertion && formik.errors.assertion && (
                        <p className="text-xs text-red-500 mt-1">
                          {formik.errors.assertion}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="response">
                        {t('intelligentFAQ.response')}
                      </Label>
                      <Textarea
                        id="response"
                        name="response"
                        value={formik.values.response}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder={t('intelligentFAQ.responsePlaceholder')}
                        rows={3}
                        className={
                          formik.touched.response && formik.errors.response
                            ? 'border-red-500'
                            : ''
                        }
                      />
                      {formik.touched.response && formik.errors.response && (
                        <p className="text-xs text-red-500 mt-1">
                          {formik.errors.response}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDialogOpenChange(false)}
                      >
                        {t('intelligentFAQ.cancel')}
                      </Button>
                      <Button type="submit" disabled={formik.isSubmitting}>
                        {editingFAQ
                          ? t('intelligentFAQ.update')
                          : t('intelligentFAQ.add')}{' '}
                        FAQ
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {faqItems.length > 0 && (
              <div className="space-y-2">
                {faqItems.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {t('intelligentFAQ.assertionLabel')} {item.assertion}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {t('intelligentFAQ.responseLabel')} {item.response}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFAQ(item)}
                          className="h-6 w-6 p-0"
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFAQ(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
