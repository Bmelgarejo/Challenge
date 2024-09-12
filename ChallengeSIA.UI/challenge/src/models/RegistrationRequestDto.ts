export interface RegistrationRequestDto {
    email: string;
    name: string;
    phoneNumber: number;
    password: string;
  }

  export interface UserDto {
    id: string;
    email: string;
    phoneNumber: string;
    userName: string;
  }
  
  export interface ResponseDto {
    result?: LoginResponseDto;
    isSuccess: boolean;
    message: string;
    userResult?: UserDto;
    usersResult: UserDto[];
  }

  export interface LoginResponseDto {
    user: UserDto;
    token: string;
  }