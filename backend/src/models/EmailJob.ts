
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class EmailJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  email!: string;

  @Column()
  subject!: string;

  @Column("text")
  body!: string;

  @Column()
  sender!: string;

  @Column()
  sendAt!: Date;

  @Column({ default: "scheduled" })
  status!: "scheduled" | "sent" | "failed";

  @Column({ default: 0 })
  sequence!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  sentAt!: Date;
}
