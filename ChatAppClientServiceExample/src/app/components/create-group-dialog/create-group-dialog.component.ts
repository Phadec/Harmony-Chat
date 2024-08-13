import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors, ValidatorFn
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FriendsService } from '../../services/friends.service';
import { GroupService } from '../../services/group.service';
import { FriendDto } from '../../models/friend.dto';

@Component({
  selector: 'app-create-group-dialog',
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.css']
})
export class CreateGroupDialogComponent implements OnInit {
  createGroupForm: FormGroup;
  friends: FriendDto[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateGroupDialogComponent>,
    private friendsService: FriendsService,
    private groupService: GroupService
  ) {
    this.createGroupForm = this.fb.group({
      Name: ['', Validators.required],
      AvatarFile: [null, Validators.required],
      MemberIds: this.fb.array([], Validators.compose([
        Validators.required,
        this.minSelectedCheckboxes(3) // Custom validator for minimum 3 selections
      ]))
    });
  }

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getFriends(userId).subscribe(
        (response) => {
          this.friends = response.$values || [];
        },
        (error) => {
          console.error('Failed to load friends', error);
        }
      );
    }
  }

  onFileChange(event: any): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.createGroupForm.patchValue({
        AvatarFile: file
      });
    }
  }

  onCheckboxChange(e: any): void {
    const checkArray: FormArray = this.createGroupForm.get('MemberIds') as FormArray;

    if (e.target.checked) {
      checkArray.push(new FormControl(e.target.value));
    } else {
      let i: number = 0;
      checkArray.controls.forEach((item) => {
        const control = item as FormControl;
        if (control.value === e.target.value) {
          checkArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  minSelectedCheckboxes(min: number): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      if (formArray instanceof FormArray) {
        const totalSelected = formArray.controls
          .map(control => control.value)
          .filter(value => value !== null).length;
        return totalSelected >= min ? null : { required: true };
      }
      return null;
    };
  }


  onCreate(): void {
    if (this.createGroupForm.valid) {
      const formData = new FormData();
      formData.append('Name', this.createGroupForm.get('Name')?.value);
      formData.append('AvatarFile', this.createGroupForm.get('AvatarFile')?.value);

      const memberIds = this.createGroupForm.get('MemberIds')?.value;
      memberIds.forEach((id: string) => {
        formData.append('MemberIds', id);
      });

      this.groupService.createGroupChat(formData).subscribe(
        () => {
          console.log('Group created successfully');
          this.dialogRef.close(true);  // Close the dialog and return success
        },
        (error) => {
          console.error('Failed to create group', error);
        }
      );
    }
  }
  friendControl(id: string): FormControl {
    const checkArray = this.createGroupForm.get('MemberIds') as FormArray;
    return checkArray.controls.find(control => control.value === id) as FormControl || new FormControl(false);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
