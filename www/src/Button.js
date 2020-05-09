import styled from 'styled-components'

const Button = styled.button`
  border: none;
  background-color: #ccc;
  color: white;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  background-color: ${props => props.background || 'white'};

  ${props => props.icon ? `
    padding: 8px;
  ` : ''}

  ${props => props.icontext ? `
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 8px;

    svg {
      margin-right: 4px;
    }
  ` : ''}

  &:hover {
    opacity: 0.8;
  }
`

export { Button as default }
