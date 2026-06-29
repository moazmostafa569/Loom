import * as z from 'zod';

export const registrationSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters').max(40, 'Full Name must be less than 40 characters'),
  username: z.string()
    .min(3, 'Please choose a username that follows Loom\'s Terms of Service.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Please choose a username that follows Loom\'s Terms of Service.'),
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, 'Password must include uppercase, lowercase, a number, and a special character'),
  rePassword: z.string(),
  dateOfBirth: z.string().nonempty('Please select your date of birth').refine((date)=>{
    let currentYear = new Date().getFullYear();
    let birthYear = new Date(date).getFullYear();
    let age = currentYear - birthYear;
    return age >= 18;
  }, 'You must be at least 18 years old'),
  gender: z.string().refine((value) => !!value, 'Please select a gender'),
  terms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to Loom\'s Terms of Service and Privacy Policy.' }),
  }),
}).refine((data) => data.password === data.rePassword, {
  message: 'Passwords do not match',
  path: ['rePassword']
});

const passwordField = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, 'Password must include uppercase, lowercase, a number, and a special character')

export const changePasswordSchema = z.object({
  password: passwordField,
  rePassword: z.string(),
}).refine((data) => data.password === data.rePassword, {
  message: 'Passwords do not match',
  path: ['rePassword'],
})

export const settingsChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: passwordField,
  rePassword: z.string(),
}).refine((data) => data.password === data.rePassword, {
  message: 'Passwords do not match',
  path: ['rePassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/, 'Password must include uppercase, lowercase, a number, and a special character'),
})
 