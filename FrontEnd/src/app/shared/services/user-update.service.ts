import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserUpdateService {
    private userUpdatedSource = new Subject<any>();
    
    userUpdated$ = this.userUpdatedSource.asObservable();

    notifyUserUpdate(userData: any): void {
        this.userUpdatedSource.next(userData);
    }
}