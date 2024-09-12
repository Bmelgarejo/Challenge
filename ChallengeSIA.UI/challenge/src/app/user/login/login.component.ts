import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';      
import { UserService } from 'src/app/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit(): void {}

  login() {
    const loginRequest = {
      email: this.email,
      password: this.password
    };

    this.userService.login(loginRequest).subscribe(
      response => {
        if (response.isSuccess) {
          this.router.navigate(['/home']);  
        } else {
          this.errorMessage = response.message || 'Error en el inicio de sesión';
        }
      },
      error => {
        this.errorMessage = 'Ocurrió un error al intentar iniciar sesión. Inténtalo de nuevo más tarde.';
        console.error('Error en login:', error);
      }
    );
  }
}
