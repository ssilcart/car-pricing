import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) => {
        return Promise.resolve({
          id,
          email: 'foo@bar.com',
          password: 'Abc.123',
        } as User);
      },
      find: (email: string) => {
        return Promise.resolve([
          {
            id: 1,
            email,
            password: 'Abc.123',
          } as User,
        ]);
      },
      // update: () => {},
      // remove: () => {},
    };
    fakeAuthService = {
      signin: (email: string, password: string) => {
        return Promise.resolve({
          id: 1,
          email,
          password,
        } as User);
      },
      // signup: () => { },
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllUsers', () => {
    it('should return a list of users by email', async () => {
      const userEmail = 'foo@bar.com';
      const users = await controller.findAllUsers(userEmail);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].email).toEqual(userEmail);
    });
  });

  describe('findUser', () => {
    it('should return one user by user id', async () => {
      const userId = 1;
      const user = await controller.findUser(String(userId));
      expect(user).toBeDefined();
      expect(user.id).toEqual(userId);
    });

    it('should throw an exception if user is not found', async () => {
      const userId = 50;
      fakeUsersService.findOne = () => null;
      await expect(controller.findUser(String(userId))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('signinUser', () => {
    it('should set a session object related to sign in process', async () => {
      const session = { userId: null };
      const signInUser = {
        id: 1,
        email: 'foo@bar.com',
        password: 'abc.123',
      };
      const user = await controller.signinUser(signInUser, session);
      expect(user).toBeDefined();
      expect(session.userId).toBeDefined();
      expect(session.userId).toEqual(signInUser.id);
    });
  });
});
