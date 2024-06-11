import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferralFacilityComponent } from './referral-facility.component';

describe('ReferralFacilityComponent', () => {
  let component: ReferralFacilityComponent;
  let fixture: ComponentFixture<ReferralFacilityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReferralFacilityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReferralFacilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
