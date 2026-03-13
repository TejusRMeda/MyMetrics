# CSV Import Format for Weekly Support Reports

Convert the weekly support report PDF into CSV using this exact format.

## Rules

- One CSV file, multiple sections per week
- Every row starts with: `section,week_start,week_end`
- Dates are `YYYY-MM-DD` format
- Use col1-col8 as generic columns (meaning depends on section)
- Wrap any text containing commas in double quotes
- Leave unused columns empty
- Percentages and ratings are plain numbers (not "54%", just "54")

## Header Row

```
section,week_start,week_end,col1,col2,col3,col4,col5,col6,col7,col8
```

## Sections and Column Meanings

| Section | col1 | col2 | col3 | col4 | col5 | col6 | col7 | col8 |
|---------|------|------|------|------|------|------|------|------|
| summary | tickets_total | calls | patient_support_tickets | total_submissions | ticket_pct | patient_pct | satisfaction_rating | notes |
| trust_tickets | trust_name | ticket_count | | | | | | |
| trust_issues | trust_name | issue_name | count | | | | | |
| weekly_issues | issue_name | count | | | | | | |
| product_tickets | product_name | ticket_count | | | | | | |
| channel_breakdown | channel_name | percentage | | | | | | |
| agent_feedback | agent_name | comment | | | | | | |
| version_tickets | version | ticket_count | | | | | | |

## Example Output

```csv
section,week_start,week_end,col1,col2,col3,col4,col5,col6,col7,col8
summary,2025-01-06,2025-01-10,142,89,23,254,8.5,3.2,92,Normal week
trust_tickets,2025-01-06,2025-01-10,NCA,45,,,,,,
trust_tickets,2025-01-06,2025-01-10,Barts Health,32,,,,,,
trust_issues,2025-01-06,2025-01-10,NCA,Patient Help,8,,,,,
trust_issues,2025-01-06,2025-01-10,NCA,Login Issues,5,,,,,
weekly_issues,2025-01-06,2025-01-10,Patient Help,12,,,,,,
weekly_issues,2025-01-06,2025-01-10,Login Issues,9,,,,,,
product_tickets,2025-01-06,2025-01-10,MyPreOp+,28,,,,,,
channel_breakdown,2025-01-06,2025-01-10,Voice,54,,,,,,
channel_breakdown,2025-01-06,2025-01-10,Email,30,,,,,,
agent_feedback,2025-01-06,2025-01-10,Lizzy,"Great week, handled escalations well",,,,,,
version_tickets,2025-01-06,2025-01-10,3.2.1,15,,,,,,
```

## Important Notes

- **One** summary row per week, **multiple** rows for all other sections
- Trust names, issue names, product names, channel names, and agent names must **exactly match** what's configured in the system (matching is case-insensitive)
- If a value is missing from the PDF, leave the column empty
- Unrecognized names will show as warnings during import and those rows will be skipped
