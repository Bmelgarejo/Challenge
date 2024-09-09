import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';      
import { UserService } from 'src/app/user.service';
import { RegistrationRequestDto } from 'src/models/RegistrationRequestDto';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  name: string = '';
  email: string = '';
  password: string = '';
  phoneNumber: number = 0;
  confirmPassword: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  register() {
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    const registerRequest: RegistrationRequestDto = {
      email: this.email,
      name: this.name,
      phoneNumber: this.phoneNumber,
      password: this.password
    };

    this.userService.register(registerRequest).subscribe(
      response => {
        if (response.isSuccess) {
          this.successMessage = 'Registro exitoso. Redirigiendo al inicio de sesión...';
          setTimeout(() => this.router.navigate(['/login']), 2000); // Redirigir al login después de 2 segundos
        } else {
          this.errorMessage = response.message || 'Error en el registro';
        }
      },
      error => {
        this.errorMessage = 'Ocurrió un error al intentar registrarse. Inténtalo de nuevo más tarde.';
        console.error('Error en registro:', error);
      }
    );
  }
}
