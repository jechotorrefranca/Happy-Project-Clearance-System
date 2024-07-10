import React from "react";
import {
  Body,
  Section,
  Text,
  Container,
  Row,
  Column,
} from "@react-email/components";

const Email = ({ student, incompleteClearances }) => {
  return (
    <Container>
      <Body>
        <Section>
          <Text>Dear {student.fullName},</Text>
        </Section>
        <Section>
          <Text>
            This is a reminder that you have incomplete clearances for the
            following:
          </Text>
        </Section>
        <Section>
          {incompleteClearances.map((subject) => (
            <Row key={subject}>
              <Column>
                <Text>- {subject}</Text>
              </Column>
            </Row>
          ))}
        </Section>
        <Section>
          <Text>
            Please submit your requirements as soon as possible to complete your
            clearance process.
          </Text>
        </Section>
        <Section>
          <Text>Thank you,</Text>
        </Section>
        <Section>
          <Text>The School Administration</Text>
        </Section>
      </Body>
    </Container>
  );
};

export default Email;
