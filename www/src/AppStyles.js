import styled from 'styled-components'

const AppStyles = styled.div`
  h1 {
    text-align: center;
    padding: 2rem;
    font-size: 48px;
    line-height: 50px;
  }

  .container {
    margin: 0 auto;
    max-width: 960px;
    position: relative;
  }

  main {
    padding: 1rem;
    border-radius: 1rem;
    background-color: white;
    color: #333;
  }

  main.container {
    margin-top: 1.5rem;
    margin-bottom: 3rem;
  }

  footer {
    text-align: right;
    font-size: 12px;
    position: fixed;
    bottom: 0;
    right: 0;
    padding: 4px 8px;
    background-color: white;
    color: #747474;
    border-radius: 4px 0 0 0;
  }

  .job {
    margin-bottom: 2rem;

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .spacer {
        flex-grow: 1;
      }

      button {
        margin-left: 8px;
      }
    }

    summary {
      cursor: pointer;
    }
  }

  pre {
    overflow-x: scroll;
    max-width: 100%;
    background-color: #f2f2f2;
    border-radius: 1rem;
    padding: 8px;
    margin-top: 8px;
    margin-bottom: 0;
  }

  .no-data {
    text-align: center;
    font-weight: 500;
  }

  .add-btn {
    position: absolute;
    right: 0;
    bottom: 50%;
    transform: translateY(50%);
  }

  svg {
    display: block;
  }

  .add-form {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 1rem;

    input {
      flex-grow: 1;
      padding: 1px 4px;
      font-size: 12px;
      line-height: 22px;
    }

    button {
      border-radius: 0 4px 4px 0;
    }
  }

  .logs {
    max-height: 360px;
    overflow-y: auto;
  }

  .progress-label {
    margin-top: 12px;
  }

  .progress-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    margin-bottom: 12px;

    p {
      font-weight: bold;
      font-size: smaller;
    }

    progress {
      flex-grow: 1;
      margin-left: 8px;
    }
  }
`

export default AppStyles