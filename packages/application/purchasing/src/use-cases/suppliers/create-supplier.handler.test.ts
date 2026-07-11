import { describe, it, expect, vi } from 'vitest';
import { CreateSupplierCommand, type CreateSupplierInput } from './index';
import { Supplier } from '@packages/domain-purchasing';

describe('CreateSupplierCommand', () => {
  it('creates supplier when phone is unique', async () => {
    const mockRepo = {
      findByPhone: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    } as any;

    const command = new CreateSupplierCommand(mockRepo);
    const input: CreateSupplierInput = {
      companyId: 'company-1',
      name: { ar: 'المورد' },
      phone: '+201000000000',
    };

    const result = await command.execute(input);
    expect(result.id).toBeDefined();
    expect(result.phone).toBe('+201000000000');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rejects when phone already exists', async () => {
    const existing = Supplier.create({
      companyId: 'company-1',
      name: { ar: 'مورد آخر' },
      phone: '+201000000000',
    });

    const mockRepo = {
      findByPhone: vi.fn().mockResolvedValue(existing),
      save: vi.fn(),
    } as any;

    const command = new CreateSupplierCommand(mockRepo);
    const input: CreateSupplierInput = {
      companyId: 'company-1',
      name: { ar: 'المورد' },
      phone: '+201000000000',
    };

    await expect(command.execute(input)).rejects.toThrow('Supplier with this phone number already exists');
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
