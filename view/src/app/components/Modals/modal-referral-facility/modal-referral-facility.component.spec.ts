import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalReferralFacilityComponent } from './modal-referral-facility.component';

describe('ModalReferralFacilityComponent', () => {
  let component: ModalReferralFacilityComponent;
  let fixture: ComponentFixture<ModalReferralFacilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalReferralFacilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalReferralFacilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
