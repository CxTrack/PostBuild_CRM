/**
 * ManageCustomFieldsModal - Thin wrapper for CustomFieldsPanel scoped to products
 */

import { CustomFieldsPanel } from '@/components/settings/CustomFieldsPanel';

interface ManageCustomFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageCustomFieldsModal({ isOpen, onClose }: ManageCustomFieldsModalProps) {
  return (
    <CustomFieldsPanel
      entityType="product"
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
