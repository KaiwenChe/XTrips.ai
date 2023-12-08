import requests
import jsons

import uuid
import pathlib
import logging
import sys
import os
import base64

from configparser import ConfigParser




############################################################
#
# prompt
#
def prompt():
  """
  Prompts the user and returns the command number

  Parameters
  ----------
  None

  Returns
  -------
  Command number entered by user (0, 1, 2, ...)
  """
  print()
  print(">> Enter a command:")
  print("   0 => register")
  print("   1 => login")

  print("   6 => generate travel tips for your trip")


  cmd = input()

  if cmd == "":
    cmd = -1
  elif not cmd.isnumeric():
    cmd = -1
  else:
    cmd = int(cmd)

  return cmd


############################################################
#
# register
#
def register(baseurl):
  """
  Register user in the database

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/register'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:
        # we'll have an error message
        body = res.json()
        print("Error message:", body)
      #
      return

    body = res.json()


  except Exception as e:
    logging.error("register() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return
  
def book(baseurl, data):
    try:
        print('Please input payment information to book your flight.')
        while True:
            credit_name = input('Credit cardholder name:')
            print('Supported card type: Visa, Mastercard')
            card_number = input('Credit card number:')
            cvv = input('credit card cvv code (3 digits): ')
            if len(credit_name) == 0:
                print('No name is provided. Please input payment again.')
            elif not card_number.isdigit() or len(card_number) != 16 or card_number[0] not in ['2', '4', '5']:
                print('invalid card number. Please input payment again.')
            elif len(cvv) != 3 or not cvv.isdigit():
                print('Transaction failed. Please input payment again.')
            else:
                break
        api = '/book'
        url = baseurl + api
        res = requests.post(url, json=data)
        if res.status_code != 200:
            print('something wrong happened...')
            return
        else:
            print('Your booking is made successfully!')
    except Exception as e:
        logging.error("book() failed:")
        logging.error(e)
        return


def display(baseurl, userid):
    try:
        api = '/display'
        url = baseurl + api
        res = requests.get(url, json=userid)
        if res.status_code != 200:
            print('something wrong happened...')
            return
        body = res.json()
        data = body['data']
        if len(data) == 0:
            print('No reservation found.')
            return 
        print('Reservation:')
        for i in data:
            print()
            fligtnumber = i['flightnumber']
            origin = i['origin']
            dest = i['dest']
            session_str = i['session_string']
            depart_date = i['depart_date']
            arrival_date = i['arrival_date']
            stopover_duration = i['stopover_duration']
            fares = i['fares']
            print(fligtnumber, session_str)
            print(origin, 'to', dest)
            print('Departing time:', depart_date)
            print('Arrival time:', arrival_date)
            if stopover_duration is not None:
                print('stopover duration time:', stopover_duration)
            print(fares)
            print()
            print('===============================================')
    except Exception as e:
        logging.error("display() failed:")
        logging.error(e)
        return
############################################################
#
# generate
#
def generate(baseurl):
  """
  Generate ai recommendation based on the booking information of the user

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """
  try:
    api = "/generate"

    print("Enter your confirmation number: ")
    confirmation_number = input()

    url = baseurl + api
    
    data = {"confirmation_number": confirmation_number}
    response = requests.post(url, json=data)

    if response.status_code != 200:
      # failed:
      print("Failed with status code:", response.status_code)
      print("url: " + url)
      if response.status_code == 400 or response.status_code == 500:
        body = response.json()
        print("Error message:", body["message"])
        return
      
    body = response.json()
    print(body['message'])

  except Exception as e:
    logging.error("generate() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


############################################################
# main
#
try:
  print('** Welcome to Xtrips.ai **')
  print()

  # eliminate traceback so we just get error message:
  sys.tracebacklimit = 0

  #
  # what config file should we use for this session?
  #
  config_file = 'client-config.ini'


  #
  # setup base URL to web service:
  #
  configur = ConfigParser()
  configur.read(config_file)
  baseurl = configur.get('client', 'webservice')

  #
  # make sure baseurl does not end with /, if so remove:
  #
  if len(baseurl) < 16:
    print("**ERROR: baseurl '", baseurl, "' is not nearly long enough...")
    sys.exit(0)

  if baseurl == "https://YOUR_GATEWAY_API.amazonaws.com":
    print("**ERROR: update config.ini file with your gateway endpoint")
    sys.exit(0)

  lastchar = baseurl[len(baseurl) - 1]
  if lastchar == "/":
    baseurl = baseurl[:-1]

  #
  # main processing loop:
  #
  cmd = prompt()

  while cmd != 0:
    #
    if cmd == 1:
      register(baseurl)
    elif cmd == 6:
      generate(baseurl)
    
    else:
      print("** Unknown command, try again...")
    #
    cmd = prompt()

  #
  # done
  #
  print()
  print('** done **')
  sys.exit(0)

except Exception as e:
  logging.error("**ERROR: main() failed:")
  logging.error(e)
  sys.exit(0)
