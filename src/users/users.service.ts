import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const user = this.usersRepository.create({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      role: input.role ?? UserRole.EMPLOYEE,
    });
    return this.usersRepository.save(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async deactivate(id: number): Promise<User> {
    await this.usersRepository.update(id, { active: false });
    return this.usersRepository.findOneOrFail({ where: { id } });
  }
}
