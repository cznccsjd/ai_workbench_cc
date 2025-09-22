/**
 * 卡片详情模态框
 * 显示和编辑卡片的详细信息
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardUpdate, PriorityLevel } from '@/types/kanban';

interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: CardUpdate) => void;
  onDelete: (cardId: string) => void;
}

const PRIORITY_OPTIONS = [
  { value: PriorityLevel.LOW, label: '低优先级', color: 'text-green-600' },
  { value: PriorityLevel.MEDIUM, label: '中优先级', color: 'text-yellow-600' },
  { value: PriorityLevel.HIGH, label: '高优先级', color: 'text-orange-600' },
  { value: PriorityLevel.URGENT, label: '紧急', color: 'text-red-600' }
];

const COLOR_OPTIONS = [
  { value: '', label: '默认' },
  { value: '#3B82F6', label: '蓝色' },
  { value: '#10B981', label: '绿色' },
  { value: '#F59E0B', label: '黄色' },
  { value: '#EF4444', label: '红色' },
  { value: '#8B5CF6', label: '紫色' }
];

export default function CardModal({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete
}: CardModalProps) {
  const [formData, setFormData] = useState<CardUpdate>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (card && isOpen) {
      setFormData({
        title: card.title,
        description: card.description,
        due_date: card.due_date,
        priority: card.priority,
        color: card.color,
        tags: card.tags,
        is_completed: card.is_completed
      });
      setIsSubmitting(false);
    }
  }, [card, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card || !formData.title?.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('保存卡片失败:', error);
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && formData.tags && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTagAdd();
    }
  };

  const handleDelete = async () => {
    if (!card) return;

    if (window.confirm('确定要删除这张卡片吗？此操作不可恢复。')) {
      onDelete(card.id);
      onClose();
    }
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color || '#6B7280' }}
              />
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {card.title}
              </Dialog.Title>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                title="删除卡片"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-md hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 内容 */}
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 标题 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  卡片标题 *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入卡片标题"
                />
              </div>

              {/* 描述 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入卡片描述（可选）"
                />
              </div>

              {/* 优先级和颜色 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    优先级
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority || 'medium'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                    颜色标签
                  </label>
                  <select
                    id="color"
                    name="color"
                    value={formData.color || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {COLOR_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 截止日期 */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(formData.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="添加标签"
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 完成状态 */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_completed"
                  name="is_completed"
                  checked={formData.is_completed || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_completed" className="ml-2 text-sm text-gray-700">
                  标记为已完成
                </label>
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title?.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '保存中...' : '保存更改'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}