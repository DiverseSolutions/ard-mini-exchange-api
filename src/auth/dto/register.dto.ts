import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from 'class-validator';

export class RegisterDto {

    @ApiProperty()
    @IsNotEmpty()
    phone: string;

    @ApiProperty()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: "Should match with password"
    })
    @IsNotEmpty()
    password2: string;
}