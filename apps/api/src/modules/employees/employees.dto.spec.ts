import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from './employees.dto';

describe('CreateEmployeeDto', () => {
  it('accepts, normalizes and validates the complete profile contract', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      legalName: 'Pessoa Fictícia',
      cpf: '529.982.247-25',
      birthDate: '1990-02-28',
      maritalStatus: 'SINGLE',
      personalEmail: 'pessoa@dp-system.local',
      phone: '(11) 99999-0000',
      address: { postalCode: '70000-001', state: 'df', country: 'Brasil' },
      emergencyContact: {
        name: 'Contato Fictício',
        relationship: 'Pessoa indicada',
        phone: '(11) 98888-0000',
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.cpf).toBe('52998224725');
    expect(dto.address?.postalCode).toBe('70000001');
    expect(dto.address?.state).toBe('DF');
  });

  it('rejects invalid CPF, future birth date and incomplete emergency contact', async () => {
    const dto = plainToInstance(CreateEmployeeDto, {
      legalName: 'Pessoa Fictícia',
      cpf: '111.111.111-11',
      birthDate: '2999-01-01',
      emergencyContact: { name: 'Contato incompleto' },
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['cpf', 'birthDate', 'emergencyContact']),
    );
  });
});
